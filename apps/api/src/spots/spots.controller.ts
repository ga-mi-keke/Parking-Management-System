import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { SpotsService } from './spots.service';

@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  findAll() {
    return this.spotsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSpotDto) {
    return this.spotsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpotDto) {
    return this.spotsService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spotsService.remove(Number(id));
  }
}
