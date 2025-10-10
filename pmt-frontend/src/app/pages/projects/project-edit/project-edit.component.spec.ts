import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ProjectEditComponent } from './project-edit.component';

describe('ProjectEditComponent', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [ProjectEditComponent, ReactiveFormsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectEditComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('should create', async () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('should build a form with name, description, startDate controls', async () => {
    const { comp } = create();
    const controls = comp.projectForm.controls as any;

    expect(controls.name).toBeDefined();
    expect(controls.description).toBeDefined();
    expect(controls.startDate).toBeDefined();

    // valeurs initiales
    expect(controls.name.value).toBe('');
    expect(controls.description.value).toBe('');
    expect(controls.startDate.value).toBe('');
  });

  it('onSubmit(): should log when form is valid', async () => {
    const { comp } = create();
    const logSpy = spyOn(console, 'log');

    comp.projectForm.setValue({
      name: 'Project Z',
      description: 'Desc',
      startDate: '2025-10-10',
    });

    expect(comp.projectForm.valid).toBeTrue();

    comp.onSubmit();

    expect(logSpy).toHaveBeenCalledWith('Project updated:', {
      name: 'Project Z',
      description: 'Desc',
      startDate: '2025-10-10',
    });
  });

  it('onSubmit(): should not log when form is invalid', async () => {
    const { comp } = create();
    const logSpy = spyOn(console, 'log');

    // Force une erreur de formulaire pour rendre form.invalid = true
    comp.projectForm.setErrors({ custom: true });

    comp.onSubmit();

    expect(logSpy).not.toHaveBeenCalled();
  });
});
