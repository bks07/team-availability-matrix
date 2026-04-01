---
status: DONE
---

# Profile picture not shown after upload

## CURRENT BEHAVIOR

After uploading a profile picture, on the profile page, only the placeholder text is shown. The same is true for the profile picture in the navigation bar.

## EXPECTED BEHAVIOR

After uploading a profile picture, the image is shown immediately on the profile page.

The same profile picture is also shown in the navigation bar wherever the user avatar is displayed.

## IMPACT

- Users cannot confirm whether their uploaded profile picture was saved successfully.
- The profile page appears incomplete because it continues to show placeholder text instead of the uploaded image.
- The navigation bar also fails to reflect the uploaded profile picture, creating an inconsistent user experience across the application.
- This reduces trust in the profile management feature and makes avatar personalization effectively unusable.

## STEPS TO REPRODUCE

1. Navigate to user profile page
2. Upload a picture

## ADDITIONAL INFORMATION

The issue is visible in at least two places:

- The user profile page.
- The navigation bar.

Although the user completes the upload flow, the interface still shows placeholder content instead of the uploaded profile picture.

