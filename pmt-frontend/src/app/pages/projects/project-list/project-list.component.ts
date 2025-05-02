import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [Ngfor],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  projects = [
    { name: 'Project Alpha', description: 'Prototype interne', owner: 'Alice' },
    { name: 'PMT App', description: 'Outil de gestion de projet', owner: 'Bob' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
