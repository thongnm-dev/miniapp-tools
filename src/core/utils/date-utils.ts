import { DateTime } from 'luxon';

export class DateUtils {

    static formatDate(date?: Date, format?: string): string {
        if (!date) return "";
        return DateTime.fromJSDate(date).toFormat(format || "YYYYMMDDHHmmss");
    }

    /**
     * @param format 
     * @returns 
     * 
     * @example
     * DateUtils.getNow('YYYYMMDD')
     * DateUtils.getNow('YYYYMMDDHHmm')
     * DateUtils.getNow('YYYYMMDDHHmmss')
     */
    static getNow(format: string): string {
        
        return DateTime.now().toFormat(format);
    }
}

