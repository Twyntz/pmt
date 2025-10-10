import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TaskService, TaskPayload } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  const BASE = '/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // -------- list --------
  it('list(): should GET tasks for a project', (done) => {
    const projectId = 'p1';
    const data = [{ id: 't1' }, { id: 't2' }];

    service.list(projectId).subscribe((res) => {
      expect(res).toEqual(data);
      done();
    });

    const req = http.expectOne(`${BASE}/projects/${projectId}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush(data);
  });

  // -------- get --------
  it('get(): should GET a task by id', (done) => {
    const projectId = 'p1';
    const taskId = 't1';
    const task = { id: taskId, title: 'Alpha' };

    service.get(projectId, taskId).subscribe((res) => {
      expect(res).toEqual(task);
      done();
    });

    const req = http.expectOne(`${BASE}/projects/${projectId}/tasks/${taskId}`);
    expect(req.request.method).toBe('GET');
    req.flush(task);
  });

  // -------- create --------
  it('create(): should POST a new task', (done) => {
    const projectId = 'p2';
    const payload: TaskPayload = {
      title: 'New task',
      description: 'desc',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: null,
      assigneeEmail: null,
      changedBy: null,
      deadline: '2025-10-31',
      endDate: undefined,
    };
    const created = { id: 'tx', ...payload };

    service.create(projectId, payload).subscribe((res) => {
      expect(res).toEqual(created);
      done();
    });

    const req = http.expectOne(`${BASE}/projects/${projectId}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(created, { status: 201, statusText: 'Created' });
  });

  // -------- update --------
  it('update(): should PATCH an existing task', (done) => {
    const projectId = 'p3';
    const taskId = 't3';
    const patch = { status: 'IN_PROGRESS' as const };

    const updated = { id: taskId, title: 'T', status: 'IN_PROGRESS' };

    service.update(projectId, taskId, patch).subscribe((res) => {
      expect(res).toEqual(updated);
      done();
    });

    const req = http.expectOne(`${BASE}/projects/${projectId}/tasks/${taskId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush(updated);
  });

  // -------- error propagation example --------
  it('list(): should propagate HTTP errors', (done) => {
    const projectId = 'oops';

    service.list(projectId).subscribe({
      next: () => fail('expected error'),
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      },
    });

    const req = http.expectOne(`${BASE}/projects/${projectId}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });
});
