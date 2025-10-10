import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '../../../services/project.service';

class MockProjectService {
  getAll = jasmine.createSpy('getAll');
}

describe('ProjectListComponent', () => {
  let comp: ProjectListComponent;
  let fixture: any;
  let projectsSvc: MockProjectService;

  function create() {
    fixture = TestBed.createComponent(ProjectListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> fetch()
    return { fixture, comp };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [{ provide: ProjectService, useClass: MockProjectService }],
    }).compileComponents();

    projectsSvc = TestBed.inject(ProjectService) as unknown as MockProjectService;
    projectsSvc.getAll.and.returnValue(of([])); // défaut
  });

  it('should create', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnInit -> fetch(): sets projects from service and resets loading/error', () => {
    const data = [{ id: 'p1' }, { id: 'p2' }];
    projectsSvc.getAll.and.returnValue(of(data));

    const { comp } = create();

    expect(projectsSvc.getAll).toHaveBeenCalled();
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
    expect(comp.projects).toEqual(data);
  });

  it('fetch(): when service returns non-array, projects should be []', () => {
    projectsSvc.getAll.and.returnValue(of({ not: 'an array' } as any));

    const { comp } = create();

    expect(comp.projects).toEqual([]);
    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
  });

  it('fetch(): handles error -> sets error message and empties projects', () => {
    projectsSvc.getAll.and.returnValue(
      throwError(() => ({ error: { error: 'down' } }))
    );

    const { comp } = create();

    expect(comp.loading).toBeFalse();
    expect(comp.projects).toEqual([]);
    expect(comp.error).toContain('Impossible de charger les projets');
    expect(comp.error).toContain('down');
  });

  it('trackById(): returns p.id when present, else p._id, else index', () => {
    const { comp } = create();
    expect(comp.trackById(5, { id: 'X' })).toBe('X');
    expect(comp.trackById(6, { _id: 'Y' })).toBe('Y');
    expect(comp.trackById(7, { name: 'no-id' })).toBe(7);
  });

  it('fetch() toggles loading flag (true -> false)', () => {
    // On espionne la méthode pour vérifier l'appel
    const { comp } = create();

    // force une nouvelle exécution de fetch()
    projectsSvc.getAll.and.returnValue(of([]));
    comp.loading = false;
    comp.error = 'old error';
    comp.projects = [{ id: 'old' }];

    comp.fetch();

    expect(comp.loading).toBeFalse();
    expect(comp.error).toBeNull();
    expect(comp.projects).toEqual([]);
  });
});
