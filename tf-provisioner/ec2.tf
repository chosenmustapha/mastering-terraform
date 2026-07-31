resource "aws_instance" "web" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.this.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name                 = "${var.project_name}-web"
    DecommissionTopicArn = local.sns_topic_arn
  }

  # 1. file provisioner — push a config that depends on a resource
  #    (the log group) which didn't exist until Terraform created it
  provisioner "file" {
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = tls_private_key.this.private_key_pem
      host        = self.public_ip
    }

    content = templatefile("${path.module}/templates/cwagent.json.tftpl", {
      log_group_name = aws_cloudwatch_log_group.app_logs.name
    })
    destination = "/tmp/cwagent.json"
  }

  # 2. remote-exec provisioner — SSH in and actually configure the box
  provisioner "remote-exec" {
    connection {
      type        = "ssh"
      user        = "ec2-user"
      private_key = tls_private_key.this.private_key_pem
      host        = self.public_ip
    }

    inline = [
      "sudo dnf install -y nginx amazon-cloudwatch-agent",
      "sudo aws s3 cp s3://${aws_s3_bucket.artifacts.bucket}/index.html /usr/share/nginx/html/index.html",
      "sudo mv /tmp/cwagent.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
      "sudo systemctl enable --now nginx",
      "sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
    ]
  }

  # 3. destroy-time provisioner — fires only on `terraform destroy`
  provisioner "local-exec" {
    when    = destroy
    command = "aws sns publish --topic-arn ${self.tags.DecommissionTopicArn} --subject 'Instance decommissioned' --message 'Instance ${self.id} was destroyed'"
  }

  depends_on = [aws_s3_object.index_page]
}
