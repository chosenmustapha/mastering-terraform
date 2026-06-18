locals {

  raw_users = csvdecode(file("${path.module}/users.csv"))

  users_map = {
    for user in local.raw_users :
    user.username => user
  }


  users_by_department = {
    for dept in var.departments :
    dept => [
      for user in local.raw_users :
      user.username
      if user.department == dept
    ]
  }


}