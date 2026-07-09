-- =========================================================
-- SCHEMA DATABASE: Gestione Teams
-- Motore: MySQL 8.0+
-- =========================================================

CREATE DATABASE IF NOT EXISTS team_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE team_management;

-- ---------------------------------------------------------
-- Tabella: users
-- Utenti registrati nella piattaforma
-- ---------------------------------------------------------
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(190) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    avatar_url      VARCHAR(255) DEFAULT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: teams
-- I team creati sulla piattaforma
-- ---------------------------------------------------------
CREATE TABLE teams (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(160) NOT NULL,
    description     TEXT DEFAULT NULL,
    logo_url        VARCHAR(255) DEFAULT NULL,
    owner_id        BIGINT UNSIGNED NOT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_teams_slug (slug),
    CONSTRAINT fk_teams_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: roles
-- Ruoli disponibili all'interno di un team (es. Admin, Manager, Membro)
-- ---------------------------------------------------------
CREATE TABLE roles (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50) NOT NULL,
    description     VARCHAR(255) DEFAULT NULL,
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB;

INSERT INTO roles (name, description) VALUES
    ('owner',   'Proprietario del team, controllo completo'),
    ('admin',   'Amministratore del team'),
    ('manager', 'Gestisce progetti e task'),
    ('member',  'Membro standard del team');

-- ---------------------------------------------------------
-- Tabella: team_members
-- Relazione N:N tra users e teams, con ruolo associato
-- ---------------------------------------------------------
CREATE TABLE team_members (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id         BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    role_id         INT UNSIGNED NOT NULL,
    joined_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_team_user (team_id, user_id),
    CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: team_invitations
-- Inviti pendenti a unirsi a un team
-- ---------------------------------------------------------
CREATE TABLE team_invitations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id         BIGINT UNSIGNED NOT NULL,
    email           VARCHAR(190) NOT NULL,
    invited_by      BIGINT UNSIGNED NOT NULL,
    role_id         INT UNSIGNED NOT NULL,
    token           VARCHAR(100) NOT NULL,
    status          ENUM('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY uq_invitation_token (token),
    CONSTRAINT fk_inv_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_inviter FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_inv_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: projects
-- Progetti associati a un team
-- ---------------------------------------------------------
CREATE TABLE projects (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id         BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     TEXT DEFAULT NULL,
    status          ENUM('planned','active','on_hold','completed','archived')
                        NOT NULL DEFAULT 'planned',
    start_date      DATE DEFAULT NULL,
    end_date        DATE DEFAULT NULL,
    created_by      BIGINT UNSIGNED NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_projects_team (team_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: tasks
-- Task/attività all'interno di un progetto
-- ---------------------------------------------------------
CREATE TABLE tasks (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT DEFAULT NULL,
    status          ENUM('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
    priority        ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    due_date        DATE DEFAULT NULL,
    created_by      BIGINT UNSIGNED NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_tasks_project (project_id),
    INDEX idx_tasks_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: task_assignments
-- Assegnazione di uno o più utenti a un task (N:N)
-- ---------------------------------------------------------
CREATE TABLE task_assignments (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id         BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    assigned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_task_user (task_id, user_id),
    CONSTRAINT fk_ta_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_ta_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: comments
-- Commenti sui task (utile per collaborazione)
-- ---------------------------------------------------------
CREATE TABLE comments (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id         BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_task (task_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Tabella: activity_log
-- Log delle attività per audit / storico
-- ---------------------------------------------------------
CREATE TABLE activity_log (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id         BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) DEFAULT NULL,
    entity_id       BIGINT UNSIGNED DEFAULT NULL,
    details         JSON DEFAULT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_log_team (team_id),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB;

-- =========================================================
-- Fine schema
-- =========================================================
