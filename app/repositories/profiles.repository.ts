import { supabase } from "~/lib/supabase";
import { BaseRepository } from "./base.repository";
import type { Result } from "~/core/types/common.types";
import type { Database } from "~/core/types/database.types";

type Profile = Database['public']['Tables']['profiles']['Row']

export class ProfilesRepository extends BaseRepository {
    async findByUserId(userId: string): Promise<Result<Profile>> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        return this.handle(data, error)
    }

    async update(userId: string, updates: Partial<Profile>): Promise<Result<Profile>> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

        return this.handle(data, error)
    }
}

export const profilesRepository = new ProfilesRepository()
