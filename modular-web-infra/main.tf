module "networking" {
  source = "./modules/networking"

  project_name        = var.project_name
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  azs                 = var.azs
}

module "security" {
  source = "./modules/security"

  project_name     = var.project_name
  vpc_id           = module.networking.vpc_id
  ssh_allowed_cidr = var.ssh_allowed_cidr
}
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
}

module "compute" {
  source = "./modules/compute"

  project_name      = var.project_name
  instance_type     = var.instance_type
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  alb_sg_id         = module.security.alb_sg_id
  web_sg_id         = module.security.web_sg_id
  bucket_name       = module.storage.bucket_name
  bucket_arn        = module.storage.bucket_arn
  asg_min_size      = var.asg_min_size
  asg_max_size      = var.asg_max_size
}