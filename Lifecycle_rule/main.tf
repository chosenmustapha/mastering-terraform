# Terraform lifeclycle rule are used to control the behavior of resources during creation, update, and deletion. 
# They allow you to specify how Terraform should handle changes to resources, 
# such as whether to recreate them or update them in place.  

# Create before destroy lifecycle rule ensures that a new resource is created before the old one is destroyed
# This is useful for resources that cannot be updated in place and would cause downtime if destroyed before the new one is created.

resource "aws_vpc" "my_vpc" {
  cidr_block = var.vpc_cidr_block

  tags = {
    Name = "main_vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.my_vpc.id
  cidr_block              = var.subnet_cidr_blocks[0]
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "public_subnet"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.my_vpc.id
  cidr_block              = var.subnet_cidr_blocks[1]
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "public_subnet_2"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.my_vpc.id

  tags = {
    Name = "main_igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.my_vpc.id

  route {
    cidr_block = var.rt_cidr_block
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_assoc_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_security_group" "web_sg" {
  name   = "web_sg"
  vpc_id = aws_vpc.my_vpc.id

  lifecycle {
    create_before_destroy = true
  }
}


# prevent_destroy lifecycle rule prevents a resource from being destroyed.
# This is useful for critical resources that should not be accidentally deleted.

resource "aws_db_subnet_group" "production_subnets" {
  name = "production-subnet-group"

  subnet_ids = [
    aws_subnet.public_subnet.id,
    aws_subnet.public_subnet_2.id
  ]

  tags = {
    Name = "production-subnet-group"
  }
}

resource "aws_db_instance" "production" {

  identifier        = "production-db"
  allocated_storage = 20
  engine            = "mysql"
  instance_class    = var.instance_class
  username          = "admin"
  password          = "password"

  db_subnet_group_name = aws_db_subnet_group.production_subnets.name

  vpc_security_group_ids = [aws_security_group.web_sg.id]
 
  lifecycle {
    prevent_destroy = false
  }
}

# ignore_changes lifecycle rule tells Terraform to ignore changes to specific attributes of a resource.
# This is useful when certain attributes are managed outside of Terraform 
# or when you want to avoid unnecessary updates.

resource "aws_autoscaling_group" "web_asg" {
  name             = "web_asg"
  max_size         = 3
  min_size         = 1
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  vpc_zone_identifier = [aws_subnet.public_subnet.id]

  lifecycle {
    ignore_changes = [desired_capacity]
  }

}

# replace_triggered_by lifecycle rule specifies that a resource should be replaced when another resource changes.
# This is useful when a resource depends on another resource that cannot be updated in place.

resource "aws_launch_template" "web" {
  name_prefix = "web_launch_template"
  image_id    = "ami-0fe18bc3cfa53a248"

  instance_type = var.instance_type[0]

  vpc_security_group_ids = [aws_security_group.web_sg.id]
}

resource "aws_instance" "web" {
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  subnet_id = aws_subnet.public_subnet.id

  lifecycle {
    replace_triggered_by = [aws_launch_template.web]
  }
}