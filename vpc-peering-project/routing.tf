resource "aws_route" "east_to_west" {
  provider                  = aws.East_region
  route_table_id            = aws_route_table.east_route_table.id
  destination_cidr_block    = aws_vpc.west.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.east_west_peering.id
}

resource "aws_route" "west_to_east" {
  provider                  = aws.West_region
  route_table_id            = aws_route_table.west_route_table.id
  destination_cidr_block    = aws_vpc.east.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.east_west_peering.id
}