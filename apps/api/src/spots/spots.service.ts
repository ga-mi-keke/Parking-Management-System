import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';

@Injectable()
export class SpotsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.parkingSpot.findMany({
      orderBy: { label: 'asc' },
    });
  }

  create(dto: CreateSpotDto) {
    return this.prisma.parkingSpot.create({
      data: {
        label: dto.label,
        occupied: dto.occupied ?? false,
      },
    });
  }

  update(id: number, dto: UpdateSpotDto) {
    return this.prisma.parkingSpot.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.parkingSpot.delete({
      where: { id },
    });
  }
}
