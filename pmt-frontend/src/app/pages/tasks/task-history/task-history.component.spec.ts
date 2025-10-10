import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TaskHistoryComponent } from './task-history.component';
import { AuthService } from '../../../services/auth.service';
import { TaskHistoryService } from '../../../services/task-history.service';

class MockAuthService {
  isLoggedIn = jasmine.createSpy('isLoggedIn');
}
class MockTaskHistoryService {
  list = jasmine.createSpy('list');
}

describe('TaskHistoryComponent', () => {
  let router: Router;
  let auth: MockAuthService;
  let historySvc: MockTaskHistoryService;
  let routeStub: any;

  function create() {
    const fixture = TestBed.createComponent(TaskHistoryComponent);
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
      imports: [TaskHistoryComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: TaskHistoryService, useClass: MockTaskHistoryService },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService) as unknown as MockAuthService;
    historySvc = TestBed.inject(TaskHistoryService) as unknown as MockTaskHistoryService;

    // valeurs par défaut
    auth.isLoggedIn.and.returnValue(true);
    historySvc.list.and.returnValue(of([]));
  });

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit: redirect to /login when not logged in', () => {
    auth.isLoggedIn.and.returnValue(false);
    const navSpy = spyOn(router, 'navigateByUrl');

    create();

    expect(navSpy).toHaveBeenCalledWith('/login');
    expect(historySvc.list).not.toHaveBeenCalled();
  });

  it('ngOnInit: redirect to /projects when params missing', () => {
    const navSpy = spyOn(router, 'navigateByUrl');
    // supprime l’id pour simuler un manque de param
    routeStub.snapshot.paramMap.get = (k: string) => (k === 'taskId' ? null : 'p1');

    create();

    expect(navSpy).toHaveBeenCalledWith('/projects');
  });

  it('load(): success with array -> sets items and clears loading/error', () => {
    historySvc.list.and.returnValue(
      of([
        { id: 'h1', status: 'TODO' },
        { id: 'h2', status: 'IN_PROGRESS' },
      ])
    );

    const { comp } = create();

    expect(historySvc.list).toHaveBeenCalledWith('p1', 't1');
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
    expect(comp.items.length).toBe(2);
  });

  it('load(): non-array -> items should be []', () => {
    historySvc.list.and.returnValue(of({} as any));

    const { comp } = create();

    expect(comp.items).toEqual([]);
    expect(comp.error).toBeNull();
  });

  it('load(): error -> sets error message and loading=false', () => {
    historySvc.list.and.returnValue(throwError(() => ({ error: { error: 'down' } })));

    const { comp } = create();

    expect(comp.loading).toBeFalse();
    expect(comp.error).toBe('down');
    expect(comp.items).toEqual([]);
  });

  it('goBack(): navigates to /projects/:id/tasks/:taskId', () => {
    const { comp } = create();
    const navSpy = spyOn(router, 'navigateByUrl');

    comp.projectId = 'px';
    comp.taskId = 'tx';
    comp.goBack();

    expect(navSpy).toHaveBeenCalledWith('/projects/px/tasks/tx');
  });
});
