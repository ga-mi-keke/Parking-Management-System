import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';

@Injectable()
export class SpotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.parkingLot.findMany({
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateSpotDto) {
    const occupied = dto.occupied ?? 0;
    if (occupied > dto.capacity) {
      throw new BadRequestException('occupied cannot exceed capacity');
    }

    return this.prisma.parkingLot.create({
      data: {
        name: dto.name,
        capacity: dto.capacity,
        occupied,
      },
    });
  }

  update(id: number, dto: UpdateSpotDto) {
    return this.prisma.parkingLot.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.parkingLot.delete({
      where: { id },
    });
  }
}
