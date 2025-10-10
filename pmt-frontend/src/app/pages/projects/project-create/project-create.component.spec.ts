import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ProjectCreateComponent } from './project-create.component';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

class MockProjectService {
  create = jasmine.createSpy('create');
}
class MockAuthService {
  isLoggedIn = jasmine.createSpy('isLoggedIn');
  getCurrentUser = jasmine.createSpy('getCurrentUser');
}

describe('ProjectCreateComponent', () => {
  let router: Router;
  let projects: MockProjectService;
  let auth: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCreateComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: ProjectService, useClass: MockProjectService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    projects = TestBed.inject(ProjectService) as unknown as MockProjectService;
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;

    // valeurs par défaut
    auth.isLoggedIn.and.returnValue(true);
    auth.getCurrentUser.and.returnValue({ id: 'u1' });
    projects.create.and.returnValue(of({ id: 'p1' }));
  });

  function create() {
    const fixture = TestBed.createComponent(ProjectCreateComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit()
    return { fixture, comp };
  }

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit: redirects to /login when not logged in', () => {
    auth.isLoggedIn.and.returnValue(false);
    const navSpy = spyOn(router, 'navigateByUrl');

    const { comp } = create();

    expect(auth.isLoggedIn).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/login');
    // early return: no loading
    expect(comp.loading).toBeFalse();
  });

  it('submit(): invalid form -> marks all as touched, no service call', () => {
    const { comp } = create();
    const markSpy = spyOn(comp.form, 'markAllAsTouched');

    // Form is invalid initially (name required)
    expect(comp.form.invalid).toBeTrue();

    comp.submit();

    expect(markSpy).toHaveBeenCalled();
    expect(projects.create).not.toHaveBeenCalled();
    expect(comp.loading).toBeFalse();
  });

  it('submit(): success with returned id -> navigates to /projects/{id}', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigateByUrl');

    // Form valid
    comp.form.setValue({ name: 'New P', description: 'd', startDate: '2025-10-10' });

    // Mock response with id
    projects.create.and.returnValue(of({ id: 'px' }));

    comp.submit();

    expect(projects.create).toHaveBeenCalledWith({
      name: 'New P',
      description: 'd',
      startDate: '2025-10-10',
      ownerId: 'u1',
    });
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
    expect(navSpy).toHaveBeenCalledWith('/projects/px');
  });

  it('submit(): success with projectId field -> navigates to /projects/{projectId}', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigateByUrl');

    comp.form.setValue({ name: 'X', description: '', startDate: '' });
    projects.create.and.returnValue(of({ projectId: 'p777' }));

    comp.submit();

    expect(navSpy).toHaveBeenCalledWith('/projects/p777');
  });

  it('submit(): success with nested data.id -> navigates to /projects/{id}', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigateByUrl');

    comp.form.setValue({ name: 'X', description: '', startDate: '' });
    projects.create.and.returnValue(of({ data: { id: 'nested' } }));

    comp.submit();

    expect(navSpy).toHaveBeenCalledWith('/projects/nested');
  });

  it('submit(): success with no id -> navigates to /projects', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigateByUrl');

    comp.form.setValue({ name: 'X', description: '', startDate: '' });
    projects.create.and.returnValue(of({}));

    comp.submit();

    expect(navSpy).toHaveBeenCalledWith('/projects');
  });

  it('submit(): HTTP error -> sets error message and resets loading', () => {
    const { comp } = create();
    spyOn(console, 'error'); // silence console

    comp.form.setValue({ name: 'Bad', description: '', startDate: '' });
    projects.create.and.returnValue(
      throwError(() => ({ error: { error: 'boom' } }))
    );

    comp.submit();

    expect(comp.loading).toBeFalse();
    expect(comp.error).toContain('Impossible de créer le projet :');
    expect(comp.error).toContain('boom');
  });

  it('submit(): uses current user id as ownerId when available', () => {
    const { comp } = create();

    auth.getCurrentUser.and.returnValue({ id: 'owner-42' });
    comp.form.setValue({ name: 'WithOwner', description: '', startDate: '' });
    projects.create.and.returnValue(of({ id: 'pZ' }));

    comp.submit();

    expect(projects.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ ownerId: 'owner-42' })
    );
  });
});
