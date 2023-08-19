declare namespace primitive {
    type ISODateTimeString =
        `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;

    type ISODateString = `${number}-${number}-${number}`; // yyyy-mm-dd

    type DateLike = string | number | Date | ISODateTimeString | ISODateString;

    type URL = `https://${string}.${string}`;
}
