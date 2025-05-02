import { Component } from '@angular/core';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.scss'
})
export class ProjectMembersComponent {
  members = [
    { username: 'alice', email: 'alice@example.com', role: 'ADMIN' },
    { username: 'bob', email: 'bob@example.com', role: 'MEMBER' }
  ];

  newMemberEmail: string = '';
  newMemberRole: string = 'MEMBER';

  addMember() {
    if (this.newMemberEmail) {
      this.members.push({
        username: this.newMemberEmail.split('@')[0],
        email: this.newMemberEmail,
        role: this.newMemberRole
      });
      this.newMemberEmail = '';
      this.newMemberRole = 'MEMBER';
    }
  }
}
