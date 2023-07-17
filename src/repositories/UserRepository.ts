import { users } from '../schema/users';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<typeof users> {
}
