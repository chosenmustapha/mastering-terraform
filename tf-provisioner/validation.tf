resource "terraform_data" "post_deploy_check" {
  triggers_replace = [aws_instance.web.id]

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<-EOT
      for i in {1..10}; do
        status=$(curl -s -o /dev/null -w "%%{http_code}" http://${aws_instance.web.public_ip})
        if [ "$status" = "200" ]; then
          aws sns publish --topic-arn ${aws_sns_topic.deploy_notifications.arn} \
            --subject "Deployment succeeded" \
            --message "Instance ${aws_instance.web.id} is serving HTTP 200"
          exit 0
        fi
        sleep 10
      done
      aws sns publish --topic-arn ${aws_sns_topic.deploy_notifications.arn} \
        --subject "Deployment FAILED health check" \
        --message "Instance ${aws_instance.web.id} never returned HTTP 200"
      exit 1
    EOT
  }
}