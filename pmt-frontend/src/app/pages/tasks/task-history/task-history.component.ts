import { Component } from '@angular/core';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [],
  templateUrl: './task-history.component.html',
  styleUrl: './task-history.component.scss'
})
export class TaskHistoryComponent {
  history = [
    { changedBy: 'Alice', changeLog: 'Tâche créée', changedAt: new Date() },
    { changedBy: 'Bob', changeLog: 'Statut modifié en "En cours"', changedAt: new Date() }
  ];
}
