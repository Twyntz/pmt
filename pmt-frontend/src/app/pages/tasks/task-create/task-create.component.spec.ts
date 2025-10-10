import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { TaskCreateComponent } from './task-create.component';
import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

class MockTaskService {
  create = jasmine.createSpy('create');
}
class MockProjectService {
  getMembers = jasmine.createSpy('getMembers');
}
class MockAuthService {
  getCurrentUser = jasmine.createSpy('getCurrentUser');
}

describe('TaskCreateComponent', () => {
  let router: Router;
  let tasks: MockTaskService;
  let projects: MockProjectService;
  let auth: MockAuthService;

  // ActivatedRoute stub avec param id = "p1"
  let routeStub: any;

  function create() {
    const fixture = TestBed.createComponent(TaskCreateComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit()
    return { fixture, comp };
  }

  beforeEach(async () => {
    routeStub = {
      snapshot: {
        paramMap: {
          get: (k: string) => (k === 'id' ? 'p1' : null),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [TaskCreateComponent, RouterTestingModule.withRoutes([])],
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

    router = TestBed.inject(Router);
    tasks = TestBed.inject(TaskService) as unknown as MockTaskService;
    projects = TestBed.inject(ProjectService) as unknown as MockProjectService;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;

    // valeurs par défaut
    auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'alice@example.com' });
    projects.getMembers.and.returnValue(of([])); // par défaut, pas de membres
    tasks.create.and.returnValue(of({ id: 't123' }));
  });

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit: accès autorisé si role ADMIN ou MEMBER → pas de redirection, members mappés', () => {
    const navSpy = spyOn(router, 'navigate');
    // l’utilisateur courant est u1 ; simulons un rôle ADMIN dans la liste
    projects.getMembers.and.returnValue(
      of([{ userId: 'u1', email: 'alice@example.com', role: 'ADMIN', username: 'alice' }])
    );

    const { comp } = create();

    expect(projects.getMembers).toHaveBeenCalledWith('p1');
    expect(navSpy).not.toHaveBeenCalled();
    // liste pour le select : { email, username }
    expect(comp.members).toEqual([{ email: 'alice@example.com', username: 'alice' }]);
  });

  it('ngOnInit: accès refusé si user non ADMIN/MEMBER → redirection vers /projects/:id', () => {
    const navSpy = spyOn(router, 'navigate');
    projects.getMembers.and.returnValue(
      of([{ userId: 'someone-else', email: 'x@y.z', role: 'VIEWER' }])
    );

    create();

    expect(navSpy).toHaveBeenCalledWith(['/projects', 'p1']);
  });

  it('ngOnInit: erreur members → redirection prudente vers /projects/:id', () => {
    const navSpy = spyOn(router, 'navigate');
    projects.getMembers.and.returnValue(throwError(() => ({ status: 500 })));

    create();

    expect(navSpy).toHaveBeenCalledWith(['/projects', 'p1']);
  });

  it('submit(): form invalide -> markAllAsTouched, pas d’appel service', () => {
    const { comp } = create();
    const markSpy = spyOn(comp.form, 'markAllAsTouched');

    // formulaire initialement invalide (title requis)
    expect(comp.form.invalid).toBeTrue();

    comp.submit();

    expect(markSpy).toHaveBeenCalled();
    expect(tasks.create).not.toHaveBeenCalled();
    expect(comp.submitting).toBeFalse();
  });

  it('submit(): succès -> navigate vers /projects/:id/tasks/:taskId', () => {
    // Autorise l’accès
    projects.getMembers.and.returnValue(
      of([{ userId: 'u1', email: 'alice@example.com', role: 'MEMBER' }])
    );
    const { comp } = create();

    const navSpy = spyOn(router, 'navigate');

    comp.form.setValue({
      title: 'New task',
      description: 'Desc',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      deadline: '2025-10-31',
      endDate: '',
      assigneeEmail: 'bob@example.com',
    });

    // on vérifie aussi que le payload formaté est envoyé
    tasks.create.and.returnValue(of({ id: 'tid' }));

    comp.submit();

    expect(tasks.create).toHaveBeenCalledWith('p1', {
      title: 'New task',
      description: 'Desc',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      deadline: '2025-10-31', // toYYYYMMDD OK
      endDate: undefined,      // champ vide -> undefined
      assigneeId: null,
      assigneeEmail: 'bob@example.com',
      changedBy: 'u1',
    });

    expect(comp.submitting).toBeFalse();
    expect(comp.serverError).toBeNull();
    expect(navSpy).toHaveBeenCalledWith(['/projects', 'p1', 'tasks', 'tid']);
  });

  it('submit(): erreur HTTP -> serverError défini et submitting=false', () => {
    projects.getMembers.and.returnValue(
      of([{ userId: 'u1', email: 'alice@example.com', role: 'ADMIN' }])
    );
    const { comp } = create();

    spyOn(console, 'error'); // silence
    comp.form.setValue({
      title: 'Bad',
      description: '',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      deadline: '20251031', // mauvais format -> undefined attendu dans payload
      endDate: null as any,
      assigneeEmail: '',
    });

    tasks.create.and.returnValue(throwError(() => ({ error: { error: 'boom' } })));

    comp.submit();

    // le payload passé doit avoir deadline undefined (toYYYYMMDD invalide)
    const call = tasks.create.calls.mostRecent();
    expect(call.args[0]).toBe('p1');
    expect(call.args[1]).toEqual(
      jasmine.objectContaining({
        title: 'Bad',
        deadline: undefined,
        endDate: undefined,
        assigneeEmail: null,
        changedBy: 'u1',
      })
    );

    expect(comp.submitting).toBeFalse();
    expect(comp.serverError).toBe('boom');
  });
});
