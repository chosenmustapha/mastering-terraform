# Meta-arguments in terraform are special arguments that can be used with any resource, data source, or module. They provide additional functionality and control over the behavior of the resource. Here are some common meta-arguments:
# 1. count: This argument allows you to create multiple instances of a resource based on a specified count. It is often used in conjunction with a variable to create a dynamic number of resources.
# 2. for_each: This argument allows you to create multiple instances of a resource based on a map or set of strings. It is useful when you want to create resources based on a collection of items.
# 3. depends_on: This argument specifies that a resource depends on the completion of another resource. It ensures that the dependent resource is created only after the specified resource has been created.
# 4. lifecycle: This argument allows you to control the lifecycle of a resource, including create, update, and delete actions. It can be used to prevent the deletion of a resource or to ignore changes to specific attributes.
# 5. provider: This argument allows you to specify a specific provider configuration for a resource. It is useful when you have multiple provider configurations and want to use a specific one for a resource.

# In this example we will be covering the count, foreach, provicer and depends_on meta-arguments.

# Define s3 bucket resource
resource "aws_s3_bucket" "amz-s3-bucket" {
  # Use count to create multiple buckets based on the bucket_names variable
  count  = length(var.bucket_names)
  bucket = var.bucket_names[count.index]
  depends_on = [ aws_s3_bucket.amz-s3-bucket-map ]
  tags   = var.tags

}

resource "aws_s3_bucket" "amz-s3-bucket-map" {
  # Use for_each to create multiple buckets based on the bucket_names_map variable
  for_each = var.bucket_names_map
  bucket   = each.value
  tags     = var.tags
}