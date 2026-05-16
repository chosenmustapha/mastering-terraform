# In this project we will be exploring Terraform expressions.
# These are the 3 types of expressions we will be exploring in this project:
# 1. Conditional Expressions: These expressions allow us to evaluate a condition and return different values based on whether the condition is true or false. They are useful for creating dynamic configurations that can adapt to different environments or conditions. 
# The syntax for a conditional expression is: condition ? true_value : false_value.
# 2. Dynamic Blocks: Dynamic blocks allow us to generate multiple nested blocks based on a list or map. 
# They are useful for creating resources that require multiple similar blocks, such as security group rules or IAM policies. The syntax for a dynamic block is: dynamic "block_name" { for_each = list_or_map { content { ... } } }.
# 3. Splat Expressions: Splats are used to extract values from a list of resources or data sources. 
# They allow us to create lists of values based on the attributes of multiple resources. The syntax for a splat expression is: resource_type.resource_name[*].attribute.


resource "aws_instance" "my_instance" {
  count = var.instances_count
  ami   = "ami-0b75f821522bcff85"

  instance_type = var.environment[0] == "development" ? var.instance_type[1] : var.instance_type[0]

  tags = var.tags
}


resource "aws_security_group" "asg" {
  name        = "my-security-group"
  description = "Security group for my instance using the default VPC"

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

}


