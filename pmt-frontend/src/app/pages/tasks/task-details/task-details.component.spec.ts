import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { TaskDetailsComponent } from './task-details.component';
import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

class MockTaskService {
  get = jasmine.createSpy('get');
}
class MockProjectService {
  getMembers = jasmine.createSpy('getMembers');
}
class MockAuthService {
  getCurrentUser = jasmine.createSpy('getCurrentUser');
}

describe('TaskDetailsComponent', () => {
  let tasks: MockTaskService;
  let projects: MockProjectService;
  let auth: MockAuthService;

  // ActivatedRoute stub avec id & taskId
  let routeStub: any;

  function create() {
    const fixture = TestBed.createComponent(TaskDetailsComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit()
    return { fixture, comp };
  }

  beforeEach(async () => {
    routeStub = {
      snapshot: {
        paramMap: {
          get: (k: string) => {
            if (k === 'id') return 'p1';
            if (k === 'taskId') return 't1';
            return null;
          },
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: TaskService, useClass: MockTaskService },
        { provide: ProjectService, useClass: MockProjectService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: (window as any).ActivatedRoute ?? 'ActivatedRoute', useValue: routeStub },
      ],
    })
      // DI token Angular pour ActivatedRoute
      .overrideProvider('ActivatedRoute' as any, { useValue: routeStub })
      .compileComponents();

    tasks = TestBed.inject(TaskService) as unknown as MockTaskService;
    projects = TestBed.inject(ProjectService) as unknown as MockProjectService;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;

    // valeurs par défaut
    tasks.get.and.returnValue(of({ id: 't1', title: 'Task', projectOwnerId: 'u1' }));
    projects.getMembers.and.returnValue(of([]));
    auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'alice@example.com' });
  });

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit: lit les params de route, charge la tâche et les membres', () => {
    const { comp } = create();

    expect(comp.projectId).toBe('p1');
    expect(comp.taskId).toBe('t1');

    expect(tasks.get).toHaveBeenCalledWith('p1', 't1');
    expect(projects.getMembers).toHaveBeenCalledWith('p1');

    expect(comp.task).toEqual(jasmine.objectContaining({ id: 't1' }));
    expect(comp.membersLoaded).toBeTrue();
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
  });

  it('load(): en cas de succès -> set task et loading=false', () => {
    const { comp } = create();

    tasks.get.calls.reset();
    tasks.get.and.returnValue(of({ id: 'tX', title: 'OK' }));

    comp.projectId = 'p9';
    comp.taskId = 't9';
    comp.load();

    expect(tasks.get).toHaveBeenCalledWith('p9', 't9');
    expect(comp.task).toEqual({ id: 'tX', title: 'OK' });
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
  });

  it('load(): en cas d’erreur -> set error et loading=false', () => {
    const { comp } = create();

    tasks.get.and.returnValue(throwError(() => ({ error: { error: 'down' } })));

    comp.load();

    expect(comp.loading).toBeFalse();
    expect(comp.error).toBe('down');
  });

  it('loadMembers(): succès tableau et non-tableau', () => {
    const { comp } = create();

    // 1er appel déjà fait au ngOnInit avec []
    projects.getMembers.and.returnValues(of([{ id: 'm1' }]), of({} as any));

    comp.loadMembers();
    expect(comp.membersLoaded).toBeTrue();
    expect(comp.members).toEqual([{ id: 'm1' }]);

    comp.loadMembers();
    expect(comp.members).toEqual([]); // non-array -> []
  });

  it('loadMembers(): erreur -> members=[], membersLoaded=true', () => {
    const { comp } = create();

    projects.getMembers.and.returnValue(throwError(() => ({ status: 500 })));

    comp.loadMembers();

    expect(comp.membersLoaded).toBeTrue();
    expect(comp.members).toEqual([]);
  });

  describe('isMemberOrAbove()', () => {
    it('retourne false si pas de current user', () => {
      const { comp } = create();
      auth.getCurrentUser.and.returnValue(null);
      expect(comp.isMemberOrAbove()).toBeFalse();
    });

    it('retourne true si OWNER via task.projectOwnerId', () => {
      const { comp } = create();
      auth.getCurrentUser.and.returnValue({ id: 'owner', email: 'o@x.y' });
      comp.task = { projectOwnerId: 'owner' };
      expect(comp.isMemberOrAbove()).toBeTrue();
    });

    it('retourne true si OWNER via task.project.ownerId', () => {
      const { comp } = create();
      auth.getCurrentUser.and.returnValue({ id: 'owner2', email: 'o@x.y' });
      comp.task = { project: { ownerId: 'owner2' } };
      expect(comp.isMemberOrAbove()).toBeTrue();
    });

    it('retourne true si OWNER via task.project.owner.id', () => {
      const { comp } = create();
      auth.getCurrentUser.and.returnValue({ id: 'owner3', email: 'o@x.y' });
      comp.task = { project: { owner: { id: 'owner3' } } };
      expect(comp.isMemberOrAbove()).toBeTrue();
    });

    it('retourne true si membre ADMIN ou MEMBER (par id ou email)', () => {
      const { comp } = create();
      auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'me@x.y' });
      comp.task = { project: {} };
      comp.members = [
        { userId: 'u1', role: 'ADMIN' },
        { email: 'me@x.y', role: 'MEMBER' },
      ];
      expect(comp.isMemberOrAbove()).toBeTrue();
    });

    it('retourne false sinon (VIEWER, autre user)', () => {
      const { comp } = create();
      auth.getCurrentUser.and.returnValue({ id: 'me', email: 'me@x.y' });
      comp.members = [{ userId: 'other', role: 'VIEWER' }];
      expect(comp.isMemberOrAbove()).toBeFalse();
    });
  });
});
