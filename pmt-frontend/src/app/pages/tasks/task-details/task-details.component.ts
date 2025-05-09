import { Component } from '@angular/core';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss'
})
export class TaskDetailsComponent {
  task = {
    title: 'Configurer la base de données',
    description: 'Créer les entités et les relations nécessaires dans MySQL.',
    status: 'TODO',
    priority: 'HIGH',
    deadline: '2025-05-30',
    endDate: null,
    assignee: 'Jean Dupont'
  };
}
