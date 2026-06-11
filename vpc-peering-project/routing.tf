resource "aws_route" "east_to_west" {
  provider                  = aws.East_region
  route_table_id            = aws_route_table.east_route_table.id
  destination_cidr_block    = aws_vpc.west.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.east_west_peering.id
  depends_on                = [aws_vpc_peering_connection_accepter.east_west_peering_accepter]
}

resource "aws_route" "west_to_east" {
  provider                  = aws.West_region
  route_table_id            = aws_route_table.west_route_table.id
  destination_cidr_block    = aws_vpc.east.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.east_west_peering.id
  depends_on                = [aws_vpc_peering_connection_accepter.east_west_peering_accepter]
}

# Route for east to central peering
resource "aws_route" "east_to_central" {
  provider                  = aws.East_region
  route_table_id            = aws_route_table.east_route_table.id
  destination_cidr_block    = aws_vpc.central.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.east_central_peering.id
  depends_on                = [aws_vpc_peering_connection_accepter.east_central_peering_accepter]
}

# Route for central to east peering
resource "aws_route" "central_to_east" {
  provider                  = aws.Canada_region
  route_table_id            = aws_route_table.central_route_table.id
  destination_cidr_block    = aws_vpc.east.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.east_central_peering.id
  depends_on                = [aws_vpc_peering_connection_accepter.east_central_peering_accepter]
}

# Route for west to central peering
resource "aws_route" "west_to_central" {
  provider                  = aws.West_region
  route_table_id            = aws_route_table.west_route_table.id
  destination_cidr_block    = aws_vpc.central.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.west_central_peering.id
  depends_on                = [aws_vpc_peering_connection_accepter.west_central_peering_accepter]
}

# Route for central to west peering
resource "aws_route" "central_to_west" {
  provider                  = aws.Canada_region
  route_table_id            = aws_route_table.central_route_table.id
  destination_cidr_block    = aws_vpc.west.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.west_central_peering.id
  depends_on                = [aws_vpc_peering_connection_accepter.west_central_peering_accepter]
}