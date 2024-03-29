declare namespace primitive {
    type ISODateTimeString =
        `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

    type ISODateString = `${number}-${number}-${number}`; // yyyy-mm-dd

    type DateLike = ISODateTimeString | ISODateString | string | number | Date;

    interface DateParts {
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
    }

    type URL = `https://${string}.${string}`;

    interface Timestamped {
        timestamp: ISODateTimeString;
    }
}
