output "service_url" {
  description = "URL of the Cloud Run service"
  value       = var.use_custom_service_account ? google_cloud_run_v2_service.app_with_sa[0].uri : google_cloud_run_v2_service.app.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = var.use_custom_service_account ? google_cloud_run_v2_service.app_with_sa[0].name : google_cloud_run_v2_service.app.name
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "service_account_email" {
  description = "Email of the Cloud Run service account"
  value       = google_service_account.cloud_run_sa.email
}

output "custom_domain_records" {
  description = "DNS records to configure for custom domain"
  value = var.custom_domain != "" ? {
    domain = var.custom_domain
    instructions = "Configure your DNS to point to Cloud Run. Check the Cloud Console for specific DNS records."
  } : null
}