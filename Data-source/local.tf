locals {

  ec2_instances = {
    web = {
      name = "web-server"
      type = "t4g.micro"
    }
    db = {
      name = "db-server"
      type = "t4g.micro"
    }
  }

}