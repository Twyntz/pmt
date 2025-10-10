import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

class MockProjectService {
  getAll = jasmine.createSpy('getAll');
  getMembers = jasmine.createSpy('getMembers');
}
class MockTaskService {
  list = jasmine.createSpy('list');
}
class MockAuthService {
  isLoggedIn = jasmine.createSpy('isLoggedIn');
  getCurrentUser = jasmine.createSpy('getCurrentUser');
}

describe('DashboardComponent', () => {
  let comp: DashboardComponent;
  let fixture: any;
  let projectsSvc: MockProjectService;
  let tasksSvc: MockTaskService;
  let auth: MockAuthService;

  function createComponent() {
    fixture = TestBed.createComponent(DashboardComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges(); // déclenche ngOnInit
    return { fixture, comp };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: ProjectService, useClass: MockProjectService },
        { provide: TaskService, useClass: MockTaskService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    projectsSvc = TestBed.inject(ProjectService) as unknown as MockProjectService;
    tasksSvc = TestBed.inject(TaskService) as unknown as MockTaskService;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;

    // Par défaut, logged in + utilisateur courant
    auth.isLoggedIn.and.returnValue(true);
    auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'alice@example.com' });

    // Valeurs par défaut pour éviter les "expectOne"
    projectsSvc.getAll.and.returnValue(of([]));
    projectsSvc.getMembers.and.returnValue(of([]));
    tasksSvc.list.and.returnValue(of([]));
  });

  it('should create', () => {
    const { comp } = createComponent();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit: when NOT logged in, should not load projects', () => {
    auth.isLoggedIn.and.returnValue(false);

    const { comp } = createComponent();

    expect(auth.isLoggedIn).toHaveBeenCalled();
    expect(comp.currentUser).toBeNull();
    expect(comp.projects).toEqual([]);
    expect(comp.selectedProjectIds).toEqual([]);
    expect(comp.loadingProjects).toBeFalse();
    expect(comp.loadingTasks).toBeFalse();
  });

  it('when getAll() returns empty, should reset columns and totals, no tasks load', () => {
    projectsSvc.getAll.and.returnValue(of([]));

    const { comp } = createComponent();

    expect(comp.projects).toEqual([]);
    expect(comp.selectedProjectIds).toEqual([]);
    expect(comp.todo.length).toBe(0);
    expect(comp.inProgress.length).toBe(0);
    expect(comp.done.length).toBe(0);
    expect(comp.totals).toEqual({ all: 0, todo: 0, inProgress: 0, done: 0 });
    expect(comp.loadingProjects).toBeFalse();
  });

  it('filters projects where user is owner or member with allowed role; then loads and normalizes tasks', () => {
    // 2 projets bruts
    const p1 = { id: 'p1', name: 'P1' };
    const p2 = { id: 'p2', name: 'P2' };
    projectsSvc.getAll.and.returnValue(of([p1, p2]));

    // p1: membres contient l’utilisateur avec rôle MEMBER
    projectsSvc.getMembers.and.callFake((projectId: string) => {
      if (projectId === 'p1') {
        return of([
          {
            userId: 'u1',
            email: 'alice@example.com',
            role: 'MEMBER',
          },
        ]);
      }
      // p2: pas de correspondance
      return of([
        { userId: 'uX', email: 'bob@example.com', role: 'VIEWER' }, // mais pas u1
      ]);
    });

    // Tasks pour p1 : différents formats/valeurs → normalisation attendue
    tasksSvc.list.and.callFake((pid: string) => {
      expect(pid).toBe('p1'); // seul p1 doit être sélectionné
      return of([
        { id: 't1', status: 'IN PROGRESS' }, // -> IN_PROGRESS
        { id: 't2', status: 'in_progress' }, // -> IN_PROGRESS (upper)
        { id: 't3', status: 'DONE' },        // -> DONE
        { id: 't4', status: 'weird' },       // -> TODO (fallback)
      ]);
    });

    const { comp } = createComponent();

    // Projets filtrés
    expect(comp.projects.map(p => p.id)).toEqual(['p1']);
    expect(comp.selectedProjectIds).toEqual(['p1']);

    // Normalisation + répartition colonnes
    expect(comp.inProgress.length).toBe(2); // t1,t2
    expect(comp.done.length).toBe(1);       // t3
    expect(comp.todo.length).toBe(1);       // t4 fallback
    expect(comp.totals).toEqual({
      all: 4,
      todo: 1,
      inProgress: 2,
      done: 1,
    });
    expect(comp.loadingTasks).toBeFalse();
    expect(comp.errorProjects).toBeNull();
    expect(comp.errorTasks).toBeNull();
  });

  it('handles error when loading members (forkJoin error) → sets errorProjects', () => {
    const p1 = { id: 'p1', name: 'P1' };
    projectsSvc.getAll.and.returnValue(of([p1]));
    projectsSvc.getMembers.and.returnValue(
      throwError(() => ({ error: { error: 'Members down' } }))
    );

    const { comp } = createComponent();

    expect(comp.loadingProjects).toBeFalse();
    expect(comp.errorProjects).toBe('Members down');
    // Pas de tasks chargées
    expect(comp.selectedProjectIds).toEqual([]);
  });

  it('handles error when loading projects → sets errorProjects', () => {
    projectsSvc.getAll.and.returnValue(
      throwError(() => ({ error: { error: 'Projects down' } }))
    );

    const { comp } = createComponent();

    expect(comp.loadingProjects).toBeFalse();
    expect(comp.errorProjects).toBe('Projects down');
  });

  it('handles error when loading tasks → sets errorTasks, resets columns and totals', () => {
    // Prépare un état avec un projet sélectionné
    const p1 = { id: 'p1', name: 'P1' };
    projectsSvc.getAll.and.returnValue(of([p1]));
    projectsSvc.getMembers.and.returnValue(
      of([{ userId: 'u1', role: 'MEMBER', email: 'alice@example.com' }])
    );
    tasksSvc.list.and.returnValue(
      throwError(() => ({ error: { error: 'Tasks down' } }))
    );

    const { comp } = createComponent();

    expect(comp.errorTasks).toBe('Tasks down');
    expect(comp.loadingTasks).toBeFalse();
    expect(comp.todo.length).toBe(0);
    expect(comp.inProgress.length).toBe(0);
    expect(comp.done.length).toBe(0);
    expect(comp.totals).toEqual({ all: 0, todo: 0, inProgress: 0, done: 0 });
  });

  it('toggleProject(): checks/unchecks project and reloads tasks', () => {
    // Place des projets dans l’état
    const p1 = { id: 'p1', name: 'P1' };
    const p2 = { id: 'p2', name: 'P2' };
    comp = TestBed.createComponent(DashboardComponent).componentInstance;

    // Injecte un état "post chargement"
    comp.projects = [p1, p2];
    comp.selectedProjectIds = ['p1']; // p1 déjà sélectionné

    // Mock tasks list pour chaque appel
    tasksSvc.list.calls.reset();
    tasksSvc.list.and.returnValue(of([]));

    // Coche p2
    const addEvent = { target: { checked: true } } as any as Event;
    comp.toggleProject(p2, addEvent);
    expect(comp.selectedProjectIds.sort()).toEqual(['p1', 'p2']);
    expect(tasksSvc.list).toHaveBeenCalledTimes(1);

    // Décoche p1
    const removeEvent = { target: { checked: false } } as any as Event;
    comp.toggleProject(p1, removeEvent);
    expect(comp.selectedProjectIds).toEqual(['p2']);
    expect(tasksSvc.list).toHaveBeenCalledTimes(2);
  });

  it('helpers: getId & projectNameById & trackById & createdAtDisplay', () => {
    comp = TestBed.createComponent(DashboardComponent).componentInstance;
    comp.projects = [{ id: '10', name: 'X' }, { id: 20, title: 'Y' }];

    expect(comp.getId({ id: 10 })).toBe('10');
    expect(comp.getId({ projectId: 33 })).toBe('33');
    expect(comp.getId('77')).toBe('77');

    expect(comp.projectNameById('10')).toBe('X');
    expect(comp.projectNameById('20')).toBe('Y');
    expect(comp.projectNameById('99')).toContain('Projet #99');

    expect(comp.trackById(0, { id: 'aa' })).toBe('aa');
    expect(comp.trackById(0, 'bb')).toBe('bb');

    expect(comp.createdAtDisplay('2025-10-10T12:34:56.789Z')).toBe('2025-10-10 12:34:56');
    expect(comp.createdAtDisplay('')).toBe('—');
  });
});
