import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent {
  name = '';
  description = '';
  startDate = '';

  constructor(private router: Router) {}

  createProject() {
    if (this.name && this.startDate) {
      console.log('Projet créé:', {
        name: this.name,
        description: this.description,
        startDate: this.startDate
      });

      // Redirection simulée
      this.router.navigate(['/projects']);
    }
  }
}
