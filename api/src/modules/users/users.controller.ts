import { Controller, Get, Patch, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Users can only view their own profile, unless they are an admin
    if (user.id !== id && user.role !== UserRole.admin) {
      throw new ForbiddenException("You can only view your own profile.");
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    // Users can only update their own profile, unless they are an admin
    if (user.id !== id && user.role !== UserRole.admin) {
       throw new ForbiddenException("You can only update your own profile.");
    }

    // Only admins can change roles
    if (updateUserDto.role && user.role !== UserRole.admin) {
        throw new ForbiddenException("Only admins can change roles.");
    }
    
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Update user password' })
  updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto, @CurrentUser() user: any) {
     // Users can only update their own password, unless they are an admin
    if (user.id !== id && user.role !== UserRole.admin) {
        throw new ForbiddenException("You can only update your own password.");
    }
    return this.usersService.updatePassword(id, updatePasswordDto);
  }
}
