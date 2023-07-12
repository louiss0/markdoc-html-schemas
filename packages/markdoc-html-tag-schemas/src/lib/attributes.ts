import type { Scalar, SchemaAttribute, ValidationError, ValidationType, } from "@markdoc/markdoc";
import {
    IntegerAttribute,
    MarkdocValidatorAttribute,
    SourceAttribute,
    createAnArrayOfMarkdocErrorObjectsBasedOnEachConditionThatIsTrue,
    generateMarkdocErrorObject,
    generateMarkdocErrorObjectThatHasAMessageThatTellsTheUserATypeIsNotRight,
    generateMarkdocErrorObjectThatHasAMessageThatTellsTheUserAValueIsNotRight
} from "packages/markdoc-html-tag-schemas/src/utils";
import { isAnObjectWithStringKeysAndValuesThatAreStringsOrNumbers, transformObjectIntoStyleString, } from "packages/markdoc-html-tag-schemas/src/utils/internal";



export type TypeIsAStringOrNumberReturnStringOrNumberConstructorElseReturnMarkdoc<T> =
    T extends ReadonlyArray<string> | RegExp
    ? StringConstructor
    : T extends ReadonlyArray<number>
    ? NumberConstructor
    : never



type TypeIsAStringOrNumberReturnTheValuesIfRegexReturnStringElseNever<T> =
    T extends ReadonlyArray<string> | ReadonlyArray<number>
    ? T[number]
    : T extends RegExp
    ? string
    : never

type ReturnTypeBasedOnConstructor<T> =
    T extends StringConstructor | "String" ? string :
    T extends NumberConstructor | "Number" ? number :
    T extends BooleanConstructor | "Boolean" ? boolean :
    T extends ArrayConstructor | "Array" ? Array<string> | Array<number> | Array<Record<string, Scalar>> :
    T extends ObjectConstructor | "Object" ? Record<string, Scalar> : never

export type ProperSchemaMatches =
    Exclude<SchemaAttribute["matches"], Array<string> | undefined>
    | ReadonlyArray<number>
    | ReadonlyArray<string>


export type RequiredSchemaAttribute =
    Exclude<SchemaAttribute["type"],
        undefined | Array<ValidationType>
    >

export type MarkdocAttributeSchema<T extends ProperSchemaMatches, U extends RequiredSchemaAttribute> = {
    type: U
    default?: T extends Array<unknown> | RegExp
    ? TypeIsAStringOrNumberReturnTheValuesIfRegexReturnStringElseNever<T>
    : ReturnTypeBasedOnConstructor<U>
    matches?: T
} & Omit<SchemaAttribute, "matches" | "default" | "type">


export type PrimaryMarkdocAttributeSchema<T extends ProperSchemaMatches, U extends RequiredSchemaAttribute> =
    MarkdocAttributeSchema<T, U>
    & { render: false }

export type SchemaAttributesWithAPrimaryKey<T extends ProperSchemaMatches, U extends RequiredSchemaAttribute> =
    { primary: PrimaryMarkdocAttributeSchema<T, U> }
    & Record<string, MarkdocAttributeSchema<T, U>>

export type SchemaAttributesWithNoPrimaryKey<T extends ProperSchemaMatches, U extends RequiredSchemaAttribute> =
    { primary?: never; }
    & Record<string, MarkdocAttributeSchema<T, U>>



const getGenerateMarkdocAttributeSchema =
    <
        T extends RequiredSchemaAttribute,
        U extends ProperSchemaMatches,
        V extends Pick<MarkdocAttributeSchema<U, T>, "errorLevel" | "description" | "type" | "required">
        = Required<Pick<MarkdocAttributeSchema<U, T>, "errorLevel" | "description" | "type" | "required">>,
    >
        (primaryConfig: V) =>
        <W extends Omit<MarkdocAttributeSchema<U, T>, GetFilledKeys<V>>>
            (secondaryConfig?: W) => Object.freeze(Object.assign({ ...primaryConfig }, secondaryConfig))

type GetFilledKeys<T extends Record<string, unknown>> = {
    [K in keyof T]: T[K] extends undefined | null ? never : K
}[keyof T]


const generateProperStringAttributeSchema = getGenerateMarkdocAttributeSchema({
    type: String,
    required: false,
    errorLevel: "error",
})

const generateBooleanAttributeSchemaThatIsNotRequired = getGenerateMarkdocAttributeSchema({
    type: Boolean,
    required: false,
    errorLevel: "error",
})



export namespace MarkdocAttributeSchemas {


    export const style = getGenerateMarkdocAttributeSchema({
        type: class extends MarkdocValidatorAttribute {


            transform(value: Record<string, string | number>): Scalar {


                return transformObjectIntoStyleString(value)


            }


            override returnMarkdocErrorObjectOrNothing(value: unknown): void | ValidationError {

                if (isAnObjectWithStringKeysAndValuesThatAreStringsOrNumbers(value))
                    return generateMarkdocErrorObjectThatHasAMessageThatTellsTheUserAValueIsNotRight(
                        `You have not put in the right values. 
                            You have to write an object that has keys that are strings 
                            and values that are either string or number that's how css works. 
                        `
                    )

            }

        },
        description: "A attribute that forces the user to specify the keys and values that are needed for schema to work"
    })();

    export const target = getGenerateMarkdocAttributeSchema({
        type: String,
        errorLevel: "error",
        matches: [
            "_target",
            "_blank",
            "_parent",
            "_top",
        ]

    })()


    export const tabindex = getGenerateMarkdocAttributeSchema({
        type: IntegerAttribute,
        description: "Specifies the allowed tabbing order",
        errorLevel: "error",
    });


    export const hidden = generateBooleanAttributeSchemaThatIsNotRequired();


    export const refferpolicy = getGenerateMarkdocAttributeSchema({
        type: String,
        matches: [
            "no-referrer",
            "no-referrer-when-downgrade",
            "origin",
            "origin-when-cross-origin",
            "same-origin",
            "strict-origin-when-cross-origin",
            "unsafe-url",
        ]
    })()

    export const title = generateProperStringAttributeSchema({
        description: "This expression is used to match string that are written using proper punctuation",
        validate(value: string,) {

            return createAnArrayOfMarkdocErrorObjectsBasedOnEachConditionThatIsTrue(
                [
                    /\b\w+ (?: [\w.,!?':;-]+)*\b/.test(value),
                    generateMarkdocErrorObject(
                        "invalid-attribute",
                        "error",
                        "THe title must contain A sentence with proper punctuation"
                    )
                ]
            )

        },

    });

    export const width = getGenerateMarkdocAttributeSchema({
        type: IntegerAttribute,
        description: "The width of the image",
        errorLevel: "warning",
    })()

    export const height = getGenerateMarkdocAttributeSchema({
        type: IntegerAttribute,
        description: "The height of the image",
        errorLevel: "warning",
    })()



    export const cite = getGenerateMarkdocAttributeSchema({
        type: SourceAttribute,
        description: "A url that leads to a citation",
        errorLevel: "warning"
    })()


    export const datetime = getGenerateMarkdocAttributeSchema({
        type: class extends MarkdocValidatorAttribute {

            returnMarkdocErrorObjectOrNothing(value: unknown): void | ValidationError {

                return value !== "string"
                    ? generateMarkdocErrorObjectThatHasAMessageThatTellsTheUserATypeIsNotRight("string")
                    : isNaN(Date.parse(value))
                        ? generateMarkdocErrorObjectThatHasAMessageThatTellsTheUserAValueIsNotRight(
                            `This value ${value} is not a parse able date time string
                             Please use a proper date format 
                            `
                        )
                        : undefined

            }
        },
        description: "The time in the form of a date",
        errorLevel: "warning"

    })();



    export const translate = generateProperStringAttributeSchema({
        description: "This attribute is for the making translations when it comes to words",
        default: "yes",
        matches: [
            "yes",
            "no",
        ]
    });



    const SUITABLE_LANGUAGES_FOR_THE_LANG_ATTRIBUTE = [
        "aa", "ab", "ace", "ach", "ada", "ady", "ae", "aeb", "af", "afh", "agq", "ain", "ak", "akk", "akz", "ale", "aln", "alt", "am", "an", "ang", "anp", "ar", "ar-001", "arc", "arn", "aro", "arp", "arq", "arw", "ary", "arz", "as", "asa", "ase", "ast", "av", "avk", "awa", "ay", "az", "az-Arab",
        "ba", "bal", "ban", "bar", "bas", "bax", "bbc", "bbj", "be", "bej", "bem", "bew", "bez", "bfd", "bfq", "bg", "bgn", "bho", "bi", "bik", "bin", "bjn", "bkm", "bla", "bm", "bn", "bo", "bpy", "bqi", "br", "bra", "brh", "brx", "bs", "bss", "bua", "bug", "bum", "byn", "byv",
        "ca", "cad", "car", "cay", "cch", "ccp", "ce", "ceb", "cgg", "ch", "chb", "chg", "chk", "chm", "chn", "cho", "chp", "chr", "chy", "ckb", "co", "cop", "cps", "cr", "crh", "crs", "cs", "csb", "cu", "cv", "cy",
        "da", "dak", "dar", "dav", "de", "del", "den", "dgr", "din", "dje", "doi", "dsb", "dtp", "dua", "dum", "dv", "dyo", "dyu", "dz", "dzg",
        "ebu", "ee", "efi", "egl", "egy", "eka", "el", "elx", "en", "en-AU", "en-CA", "en-GB", "en-US", "enm", "eo", "es", "es-419", "es-AR", "es-CL", "es-CO", "es-CR", "es-EC", "es-ES", "es-GT", "es-HN", "es-MX", "es-NI", "es-PA", "es-PE", "es-PR", "es-PY", "es-SV", "es-US", "es-UY", "es-VE", "et", "eu", "ewo", "ext",
        "fa", "fa-AF", "ff", "ff-Adlm", "ff-Latn", "fi", "fil", "fit", "fj", "fo", "fon", "fr", "fr-CA", "fr-CH", "frc", "frm", "fro", "frp", "frr", "frs", "fur", "fy",
        "ga", "gaa", "gag", "gan", "gay", "gba", "gbz", "gd", "gez", "gil", "gl", "glk", "gmh",
    ]

    export const lang = generateProperStringAttributeSchema({
        description: "An attribute for specifying the language of an element",
        default: "en",
        matches: SUITABLE_LANGUAGES_FOR_THE_LANG_ATTRIBUTE,
    })


    export const ariaHidden = generateBooleanAttributeSchemaThatIsNotRequired({
        description: "Ah attribute that specifies whether or not an element is hidden",

    });

    export const ariaLabelledBy = generateBooleanAttributeSchemaThatIsNotRequired({
        description: "A attribute that specifies which element is used to label the element",
    });

    export const ariaLabel = generateBooleanAttributeSchemaThatIsNotRequired({
        description: "A attribute that specifies the label for this element",
    });



    export const dir = generateProperStringAttributeSchema({
        description: "An attribute for specifying the reading direction of the words in the content",
        default: "auto",
        matches: [
            "auto",
            "ltr",
            "rtl",
        ],
    });

    export const draggable = generateBooleanAttributeSchemaThatIsNotRequired({
        description: "An attribute that allows an element to be draggable",
        default: false,
    });

    export const spellcheck = generateBooleanAttributeSchemaThatIsNotRequired({
        description: "An attribute that allows an element to be spell checked",
        default: false,
    });



    export const contenteditable = generateBooleanAttributeSchemaThatIsNotRequired({
        description: "An attribute that allows an element's content to be editable",
    });




}




