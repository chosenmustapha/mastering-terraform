output "alb_dns_name" {
  description = "Public URL of the Application Load Balancer"
  value = module.compute.alb_dns_name
}

output "app_logs_bucket" {
  value = module.storage.bucket_name
}