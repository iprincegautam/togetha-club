# kotlinx.serialization — keep serializers and serializable models.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep the generated serializer for every @Serializable class in the app.
-keep,includedescriptorclasses class club.togetha.app.**$$serializer { *; }
-keepclassmembers class club.togetha.app.** {
    *** Companion;
}
-keepclasseswithmembers class club.togetha.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Serializable model classes themselves (field names matter for JSON).
-keep @kotlinx.serialization.Serializable class club.togetha.app.core.model.** { *; }
