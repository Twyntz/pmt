-- Table users
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table projects
CREATE TABLE IF NOT EXISTS projects (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    owner_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Table project_members
CREATE TABLE IF NOT EXISTS project_members (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    project_id CHAR(36),
    role ENUM('ADMIN', 'MEMBER', 'OBSERVER') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Table tasks
CREATE TABLE IF NOT EXISTS tasks (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    deadline DATE,
    end_date DATE,
    project_id CHAR(36),
    assignee_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- Table task_history
CREATE TABLE IF NOT EXISTS task_history (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36),
    changed_by CHAR(36),
    change_log TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    task_id CHAR(36),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- ===========================
-- Données de test
-- ===========================

-- Utilisateurs
INSERT INTO users (id, username, email, password)
VALUES
(UUID(), 'alice', 'alice@example.com', 'password123'),
(UUID(), 'bob', 'bob@example.com', 'password456');

-- Projets
INSERT INTO projects (id, name, description, start_date, owner_id)
VALUES (
  UUID(),
  'PMT Project',
  'Project Management Tool prototype',
  CURDATE(),
  (SELECT id FROM users WHERE username = 'alice')
);

-- Membres du projet
INSERT INTO project_members (id, user_id, project_id, role)
VALUES
(UUID(), (SELECT id FROM users WHERE username = 'alice'), (SELECT id FROM projects WHERE name = 'PMT Project'), 'ADMIN'),
(UUID(), (SELECT id FROM users WHERE username = 'bob'), (SELECT id FROM projects WHERE name = 'PMT Project'), 'MEMBER');

-- Tâches
INSERT INTO tasks (id, title, description, status, priority, deadline, project_id, assignee_id)
VALUES
(UUID(), 'Setup backend', 'Configure Spring Boot and MySQL connection', 'IN_PROGRESS', 'HIGH', CURDATE() + INTERVAL 7 DAY, (SELECT id FROM projects WHERE name = 'PMT Project'), (SELECT id FROM users WHERE username = 'alice')),
(UUID(), 'Create frontend', 'Build basic Angular structure', 'TODO', 'MEDIUM', CURDATE() + INTERVAL 10 DAY, (SELECT id FROM projects WHERE name = 'PMT Project'), (SELECT id FROM users WHERE username = 'bob'));

-- Historique des tâches
INSERT INTO task_history (id, task_id, changed_by, change_log)
VALUES
(UUID(), (SELECT id FROM tasks WHERE title = 'Setup backend'), (SELECT id FROM users WHERE username = 'alice'), 'Initial setup done');

-- Notifications
INSERT INTO notifications (id, user_id, task_id, message)
VALUES
(UUID(), (SELECT id FROM users WHERE username = 'bob'), (SELECT id FROM tasks WHERE title = 'Create frontend'), 'Nouvelle tâche assignée');
