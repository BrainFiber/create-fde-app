terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "cloud_run_api" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry_api" {
  service = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloud_build_api" {
  service = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry repository for Docker images
resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = "${var.project_name}-images"
  description   = "Docker repository for ${var.project_name}"
  format        = "DOCKER"

  depends_on = [google_project_service.artifact_registry_api]
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "app" {
  name     = var.service_name
  location = var.region

  template {
    containers {
      image = var.container_image != "" ? var.container_image : "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/${var.project_name}:latest"
      
      ports {
        container_port = var.container_port
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      dynamic "env" {
        for_each = var.environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }

      liveness_probe {
        http_get {
          path = var.health_check_path
        }
        initial_delay_seconds = 10
        period_seconds        = 30
        timeout_seconds       = 3
        failure_threshold     = 3
      }

      startup_probe {
        http_get {
          path = var.health_check_path
        }
        initial_delay_seconds = 0
        period_seconds        = 10
        timeout_seconds       = 3
        failure_threshold     = 10
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    timeout = "${var.request_timeout}s"
    max_instance_request_concurrency = var.max_concurrency
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.cloud_run_api]
}

# IAM policy to make the service publicly accessible
resource "google_cloud_run_service_iam_member" "public_access" {
  count = var.allow_unauthenticated ? 1 : 0

  service  = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.project_name}-cloud-run-sa"
  display_name = "Service Account for ${var.project_name} Cloud Run"
}

# Grant necessary permissions to the service account
resource "google_project_iam_member" "cloud_run_sa_artifactregistry" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Update Cloud Run service to use custom service account
resource "google_cloud_run_v2_service" "app_with_sa" {
  count = var.use_custom_service_account ? 1 : 0

  name     = var.service_name
  location = var.region

  template {
    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = var.container_image != "" ? var.container_image : "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/${var.project_name}:latest"
      
      ports {
        container_port = var.container_port
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      dynamic "env" {
        for_each = var.environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }

      liveness_probe {
        http_get {
          path = var.health_check_path
        }
        initial_delay_seconds = 10
        period_seconds        = 30
        timeout_seconds       = 3
        failure_threshold     = 3
      }

      startup_probe {
        http_get {
          path = var.health_check_path
        }
        initial_delay_seconds = 0
        period_seconds        = 10
        timeout_seconds       = 3
        failure_threshold     = 10
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    timeout = "${var.request_timeout}s"
    max_instance_request_concurrency = var.max_concurrency
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.cloud_run_api]
}

# Domain mapping (optional)
resource "google_cloud_run_domain_mapping" "app" {
  count = var.custom_domain != "" ? 1 : 0

  location = var.region
  name     = var.custom_domain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = var.use_custom_service_account ? google_cloud_run_v2_service.app_with_sa[0].name : google_cloud_run_v2_service.app.name
  }

  depends_on = [
    google_cloud_run_v2_service.app,
    google_cloud_run_v2_service.app_with_sa
  ]
}