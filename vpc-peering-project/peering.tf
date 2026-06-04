
resource "aws_vpc_peering_connection" "east_west_peering" {
  provider      = aws.East_region
  peer_owner_id = data.aws_caller_identity.current.account_id
  vpc_id        = aws_vpc.east.id
  peer_vpc_id   = aws_vpc.west.id
  auto_accept   = false
  peer_region   = var.west_region

  tags = {
    Name = "east-west-peering"
  }
}

resource "aws_vpc_peering_connection_accepter" "east_west_peering_accepter" {
  provider                  = aws.West_region
  vpc_peering_connection_id = aws_vpc_peering_connection.east_west_peering.id
  auto_accept               = true

  depends_on = [aws_vpc_peering_connection.east_west_peering]

  tags = {
    Name = "east-west-peering-accepter"
  }
}

