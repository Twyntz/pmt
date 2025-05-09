import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [],
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.scss'
})
export class ProjectEditComponent {
  projectForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.projectForm = this.fb.group({
      name: [''],
      description: [''],
      startDate: ['']
    });
  }

  onSubmit() {
    if (this.projectForm.valid) {
      console.log('Project updated:', this.projectForm.value);
      // Ici tu enverras les données au backend
    }
  }
}
