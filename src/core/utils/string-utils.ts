
export class StringUtils {
    
    public static isBlank(str: string) {
        return str === undefined || str === null || str.length === 0;
    }
}