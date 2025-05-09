import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
  notifications = [
    { message: 'Nouvelle tâche assignée : Créer l’API', createdAt: new Date(), isRead: false },
    { message: 'Statut de la tâche "Design UI" mis à jour', createdAt: new Date(), isRead: true }
  ];
}
