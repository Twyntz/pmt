import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-project-tasks',
  standalone: true,
  imports: [NgFor],
  templateUrl: './project-tasks.component.html',
  styleUrls: ['./project-tasks.component.scss']
})
export class ProjectTasksComponent implements OnInit {
  tasks = [
    { title: 'Créer base de données', status: 'TODO', assignee: 'Alice' },
    { title: 'Configurer backend', status: 'IN_PROGRESS', assignee: 'Bob' },
    { title: 'Déployer l’app', status: 'DONE', assignee: 'Alice' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
