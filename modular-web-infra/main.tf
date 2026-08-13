module "network" {
  source = "./modules/network"
  project_name = var.project_name
  vpc_cdir = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  azs = var.azs
}
