-- Création des types ENUM
CREATE TYPE role_enum AS ENUM ('ADMIN', 'MEMBER', 'OBSERVER');
CREATE TYPE task_status_enum AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE task_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Table User
CREATE TABLE "User" (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Project
CREATE TABLE "Project" (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    owner_id UUID REFERENCES "User"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table ProjectMember
CREATE TABLE "ProjectMember" (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES "User"(id),
    project_id UUID REFERENCES "Project"(id),
    role role_enum NOT NULL
);

-- Table Task
CREATE TABLE "Task" (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status_enum NOT NULL,
    priority task_priority_enum NOT NULL,
    deadline DATE,
    end_date DATE,
    project_id UUID REFERENCES "Project"(id),
    assignee_id UUID REFERENCES "User"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table TaskHistory
CREATE TABLE "TaskHistory" (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES "Task"(id),
    changed_by UUID REFERENCES "User"(id),
    change_log TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Notification
CREATE TABLE "Notification" (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES "User"(id),
    task_id UUID REFERENCES "Task"(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de données de test
INSERT INTO "User" (id, username, email, password) VALUES
    (gen_random_uuid(), 'admin', 'admin@example.com', 'hashed_password'),
    (gen_random_uuid(), 'jane', 'jane@example.com', 'hashed_password'),
    (gen_random_uuid(), 'john', 'john@example.com', 'hashed_password');


