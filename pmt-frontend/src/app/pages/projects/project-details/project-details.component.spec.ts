import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ProjectDetailsComponent } from './project-details.component';
import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';

class MockProjectService {
  getById = jasmine.createSpy('getById');
  getUserById = jasmine.createSpy('getUserById');
  getMembers = jasmine.createSpy('getMembers');
  inviteMember = jasmine.createSpy('inviteMember');
}
class MockTaskService {
  list = jasmine.createSpy('list');
}
class MockAuthService {
  isLoggedIn = jasmine.createSpy('isLoggedIn');
  getCurrentUser = jasmine.createSpy('getCurrentUser');
}

describe('ProjectDetailsComponent', () => {
  let router: Router;
  let routeStub: any;
  let projects: MockProjectService;
  let tasks: MockTaskService;
  let auth: MockAuthService;

  function create() {
    const fixture = TestBed.createComponent(ProjectDetailsComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit
    return { fixture, comp };
  }

  beforeEach(async () => {
    // route stub avec id "p1" par défaut
    routeStub = { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'p1' : null) } } };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailsComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: ProjectService, useClass: MockProjectService },
        { provide: TaskService, useClass: MockTaskService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: (window as any).ActivatedRoute ?? 'ActivatedRoute', useValue: routeStub },
      ],
    })
      // Angular DI token pour ActivatedRoute
      .overrideProvider('ActivatedRoute' as any, { useValue: routeStub })
      .compileComponents();

    router = TestBed.inject(Router);

    projects = TestBed.inject(ProjectService) as unknown as MockProjectService;
    tasks = TestBed.inject(TaskService) as unknown as MockTaskService;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;

    // Valeurs par défaut
    auth.isLoggedIn.and.returnValue(true);
    auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'alice@example.com' });

    projects.getById.and.returnValue(of({ id: 'p1', ownerId: 'u1' }));
    projects.getUserById.and.returnValue(of({ id: 'u1', username: 'alice' }));
    projects.getMembers.and.returnValue(of([]));
    tasks.list.and.returnValue(of([]));
    projects.inviteMember.and.returnValue(of({ ok: true }));
  });

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit: redirects to /login if not logged in', () => {
    auth.isLoggedIn.and.returnValue(false);
    const navSpy = spyOn(router, 'navigateByUrl');

    const { comp } = create();

    expect(navSpy).toHaveBeenCalledWith('/login');
    // early return: pas d’appels service
    expect(projects.getById).not.toHaveBeenCalled();
    expect(tasks.list).not.toHaveBeenCalled();
  });

  it('ngOnInit: redirects to /projects if id missing', () => {
    const navSpy = spyOn(router, 'navigateByUrl');
    // id manquant
    routeStub.snapshot.paramMap.get = () => null;

    const { comp } = create();

    expect(navSpy).toHaveBeenCalledWith('/projects');
  });

  it('loadProject(): sets project and ownerName via getUserById when ownerId exists', () => {
    projects.getById.and.returnValue(of({ id: 'p1', ownerId: 'u1' }));
    projects.getUserById.and.returnValue(of({ id: 'u1', username: 'alice' }));

    const { comp } = create();

    expect(comp.project).toEqual(jasmine.objectContaining({ id: 'p1' }));
    expect(projects.getUserById).toHaveBeenCalledWith('u1');
    expect(comp.ownerName).toBe('alice');
    expect(comp.ownerError).toBeNull();
    expect(comp.errorProject).toBeNull();
  });

  it('loadProject(): when ownerId present but getUserById fails -> ownerError set', () => {
    projects.getById.and.returnValue(of({ id: 'p1', ownerId: 'u1' }));
    projects.getUserById.and.returnValue(throwError(() => ({ status: 500 })));

    const { comp } = create();

    expect(comp.ownerName).toBe('');
    expect(comp.ownerError).toBe('Impossible de récupérer le propriétaire');
  });

  it('loadProject(): when owner object present without ownerId, uses owner.username/email', () => {
    projects.getById.and.returnValue(of({ id: 'p1', owner: { id: 'u55', email: 'x@y.z' } }));

    const { comp } = create();

    expect(comp.ownerName).toBe('x@y.z');
    expect(projects.getUserById).not.toHaveBeenCalled();
  });

  it('loadProject(): error on getById -> sets errorProject', () => {
    projects.getById.and.returnValue(throwError(() => ({ error: { error: 'down' } })));

    const { comp } = create();

    expect(comp.errorProject).toBe('down');
    expect(comp.loadingProject).toBeFalse();
  });

  it('loadMembers(): success array & non-array handling', () => {
    projects.getMembers.and.returnValues(of([{ id: 'm1' }]), of({} as any));

    const { comp } = create();
    // 1er appel a déjà eu lieu au ngOnInit avec returnValue par défaut ([])

    // Force un nouvel appel pour tester non-array -> []
    comp.loadMembers();
    expect(Array.isArray(comp.members)).toBeTrue();

    comp.loadMembers();
    expect(comp.members).toEqual([]); // non-array -> []
  });

  it('loadMembers(): error -> sets errorMembers and empties list', () => {
    projects.getMembers.and.returnValue(throwError(() => ({ error: { error: 'boom' } })));

    const { comp } = create();

    expect(comp.errorMembers).toBe('boom');
    expect(comp.members).toEqual([]);
    expect(comp.loadingMembers).toBeFalse();
  });

  it('loadTasks(): success with array & non-array handling', () => {
    tasks.list.and.returnValues(of([{ id: 't1' }]), of({} as any));

    const { comp } = create();
    // 1er appel a déjà eu lieu au ngOnInit avec []

    comp.loadTasks();
    expect(comp.tasks).toEqual([{ id: 't1' }]);

    comp.loadTasks();
    expect(comp.tasks).toEqual([]); // non-array -> []
  });

  it('loadTasks(): error -> sets errorTasks and empties list', () => {
    tasks.list.and.returnValue(throwError(() => ({ error: { error: 'tasks down' } })));

    const { comp } = create();

    expect(comp.errorTasks).toBe('tasks down');
    expect(comp.tasks).toEqual([]);
    expect(comp.loadingTasks).toBeFalse();
  });

  it('invite(): invalid form -> markAllAsTouched and no service call', () => {
    const { comp } = create();
    const markSpy = spyOn(comp.inviteForm, 'markAllAsTouched');

    // form invalide (email vide)
    expect(comp.inviteForm.invalid).toBeTrue();

    comp.invite();

    expect(markSpy).toHaveBeenCalled();
    expect(projects.inviteMember).not.toHaveBeenCalled();
    expect(comp.inviting).toBeFalse();
  });

  it('invite(): success -> sets success message, resets form, reloads members', () => {
    const { comp } = create();
    const membersSpy = spyOn(comp, 'loadMembers');

    comp.inviteForm.setValue({ email: 'bob@example.com', role: 'MEMBER' });
    projects.inviteMember.and.returnValue(of({ ok: true }));

    comp.invite();

    expect(projects.inviteMember).toHaveBeenCalledWith('p1', 'bob@example.com', 'MEMBER');
    expect(comp.inviting).toBeFalse();
    expect(comp.inviteSuccess).toContain('Invitation envoyée à bob@example.com');
    expect(comp.inviteError).toBeNull();
    expect(membersSpy).toHaveBeenCalled();

    // le reset fixe role à MEMBER
    expect(comp.inviteForm.value.role).toBe('MEMBER');
  });

  it('invite(): error -> sets inviteError and resets inviting flag', () => {
    const { comp } = create();
    spyOn(console, 'error'); // silencieux si jamais

    comp.inviteForm.setValue({ email: 'bad@example.com', role: 'ADMIN' });
    projects.inviteMember.and.returnValue(throwError(() => ({ error: { error: 'nope' } })));

    comp.invite();

    expect(comp.inviting).toBeFalse();
    expect(comp.inviteError).toContain('Impossible d’inviter :');
    expect(comp.inviteError).toContain('nope');
    expect(comp.inviteSuccess).toBeNull();
  });

  it('canInvite(): true for OWNER, true for ADMIN member, false otherwise', () => {
    const { comp } = create();

    // OWNER
    comp.project = { id: 'p1', ownerId: 'u1' };
    comp.members = [{ userId: 'u2', role: 'MEMBER' }];
    auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'alice@example.com' });
    expect(comp.canInvite()).toBeTrue();

    // ADMIN member
    comp.project = { id: 'p1', ownerId: 'uX' };
    comp.members = [{ userId: 'u1', role: 'ADMIN' }];
    expect(comp.canInvite()).toBeTrue();

    // not member
    comp.members = [{ userId: 'u2', role: 'MEMBER' }];
    expect(comp.canInvite()).toBeFalse();
  });

  it('isMemberOrAbove(): true for OWNER, ADMIN, MEMBER; false otherwise', () => {
    const { comp } = create();

    // OWNER
    comp.project = { id: 'p1', ownerId: 'u1' };
    comp.members = [];
    auth.getCurrentUser.and.returnValue({ id: 'u1', email: 'alice@example.com' });
    expect(comp.isMemberOrAbove()).toBeTrue();

    // ADMIN
    comp.project = { id: 'p1', ownerId: 'uX' };
    comp.members = [{ userId: 'u1', role: 'ADMIN' }];
    expect(comp.isMemberOrAbove()).toBeTrue();

    // MEMBER
    comp.members = [{ userId: 'u1', role: 'MEMBER' }];
    expect(comp.isMemberOrAbove()).toBeTrue();

    // VIEWER/none
    comp.members = [{ userId: 'u1', role: 'VIEWER' }];
    expect(comp.isMemberOrAbove()).toBeFalse();

    // not member
    comp.members = [{ userId: 'u9', role: 'ADMIN' }];
    expect(comp.isMemberOrAbove()).toBeFalse();
  });
});
