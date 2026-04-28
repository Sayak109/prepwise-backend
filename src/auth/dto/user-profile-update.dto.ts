import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";

export class userProfileDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    old_password?: string;

    @IsString()
    @IsOptional()
    new_password?: string;
}
