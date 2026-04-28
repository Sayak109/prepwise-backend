import { SetMetadata } from '@nestjs/common';
import { Account } from '../enums/account.enum';

export const ACCOUNT_KEY = 'account';
export const AccountStatus = (...account: Account[]) => SetMetadata(ACCOUNT_KEY, account);
