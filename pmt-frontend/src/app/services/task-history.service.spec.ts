import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TaskHistoryService } from './task-history.service';

describe('TaskHistoryService', () => {
  let service: TaskHistoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskHistoryService],
    });
    service = TestBed.inject(TaskHistoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('list(): doit récupérer l’historique pour un task donné (succès)', (done) => {
    const projectId = 'p1';
    const taskId = 't1';
    const expected = [
      { id: 'h1', status: 'TODO', changedBy: 'u1' },
      { id: 'h2', status: 'IN_PROGRESS', changedBy: 'u2' },
    ];

    service.list(projectId, taskId).subscribe((res) => {
      expect(res).toEqual(expected);
      done();
    });

    const req = http.expectOne(`/api/projects/${projectId}/tasks/${taskId}/history`);
    expect(req.request.method).toBe('GET');
    req.flush(expected);
  });

  it('list(): doit propager une erreur HTTP', (done) => {
    const projectId = 'pX';
    const taskId = 'tX';

    service.list(projectId, taskId).subscribe({
      next: () => fail('Erreur attendue mais non levée'),
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      },
    });

    const req = http.expectOne(`/api/projects/${projectId}/tasks/${taskId}/history`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });
});
