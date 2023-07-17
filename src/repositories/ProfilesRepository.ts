import { profiles } from '../schema/profiles';
import { users } from '../schema/users';
import { BaseRepository } from './BaseRepository';

export class ProfilesRepository extends BaseRepository<typeof profiles> {}
