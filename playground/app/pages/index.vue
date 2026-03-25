<script setup lang="ts">
const localePath = useLocalePath()

await navigateTo(localePath('/table-remote'), { replace: true })
</script>
