# From Reset to Radio

*An O'RLY? visual explainer grounded in Espressif's ESP-IDF source at commit `08e0d30a74ad0bfd5a34933142b80f45619ee410`.*

An ESP32 is small enough to disappear inside a light switch, but turning reset into one useful Wi-Fi packet still requires a complete computer system. The boot chain must select trustworthy code from flash. FreeRTOS must share the processor cores among application and system work. Interrupts must capture hardware events without monopolizing a core. Finally, the event loop, `esp-netif`, lwIP, and the Wi-Fi driver must agree on how bytes move between an application and the radio.

This tour follows one dependency chain through the real ESP-IDF implementation. Exact function and file names stay visible in the scenes; the prose concentrates on why each layer exists and what promise it makes to the next one.

## Chapter 1 · The Boot Conveyor

Before an application can run, the chip has to turn an external flash device into a selected, mapped program. ESP-IDF splits that job between immutable mask code, a second-stage bootloader, and application startup.

### Reset begins before the application

The first instructions live in mask read-only memory. They load the second-stage bootloader from flash into a state where C code can run, but the hardware is still mostly uninitialized, the flash cache is down, and the application core remains in reset. In `components/bootloader/subproject/main/bootloader_start.c`, the second-stage `call_start_cpu0()` initializes enough hardware to inspect flash safely.

{% viz scene="books/esp32-reset-to-radio/chapter-1" section="chapter-1-bootstrap" cue="0" from="0.000" to="27.818" title="Reset hands control from mask code to the second-stage bootloader." %}
{% endviz %}

This early boundary matters because external flash is not ordinary always-ready memory. Cache and mapping machinery must be deliberately established before application code can treat it like an instruction store.

### A partition becomes executable memory

The bootloader calls `bootloader_utility_load_partition_table()`, lets `bootloader_utility_get_selected_boot_partition()` choose a factory or update slot, and finally calls `bootloader_utility_load_boot_image()`. The application-side `call_start_cpu0()` then clears BSS, initializes cache and the memory-management unit, prepares external memory, and enters the system startup functions.

{% viz scene="books/esp32-reset-to-radio/chapter-1" section="chapter-1-image" cue="4" from="27.818" to="57.585" title="The selected flash image is validated, mapped, and turned into running instructions." %}
{% endviz %}

The important idea is selection before execution. Flash can hold configuration data, update metadata, a factory image, and multiple over-the-air slots; the boot chain constructs one coherent executable view from them.

## Chapter 2 · The Scheduler Loom

Starting an image does not mean running one endless application loop. ESP-IDF builds a multitasking system in which application code, radio work, event dispatch, timers, drivers, and idle maintenance all need time on the available processor cores.

### Startup releases the cores into FreeRTOS

Processor core zero performs the shared early initialization. On multi-core targets, `system_early_init()` releases the other core into `call_start_cpu1()`, while startup functions coordinate which initialization stages may touch cache and external memory. `esp_startup_start_app()` then creates the task named `main`, and `vTaskStartScheduler()` begins ordinary scheduling.

{% viz scene="books/esp32-reset-to-radio/chapter-2" section="chapter-2-startup" cue="0" from="0.000" to="30.035" title="System startup turns two initialized cores into scheduler execution rails." %}
{% endviz %}

The core split shown here describes the classic dual-core ESP32 configuration. ESP-IDF also supports single-core configurations and newer family members with different core arrangements; the scheduling contract remains the useful abstraction.

### Readiness, priority, and blocking create the weave

The scheduler does not assign each subsystem a permanent slice. It chooses from ready tasks according to priority and affinity. A high-priority radio task can preempt application work; a task waiting on a queue leaves the core entirely; an interrupt or event can make it ready again. In `components/freertos/app_startup.c`, `main_task()` calls the application's `app_main()` and deletes itself if that function returns.

{% viz scene="books/esp32-reset-to-radio/chapter-2" section="chapter-2-scheduling" cue="4" from="30.035" to="57.957" title="Ready tasks move across the cores while blocked work yields its rail." %}
{% endviz %}

That is why `app_main()` is an entry point rather than the machine's only loop. It begins application behavior inside a scheduler that was already built to host the rest of the system.

## Chapter 3 · The Interrupt Handoff

Scheduling handles work that is ready now, but hardware can become urgent between scheduler decisions. A serial receiver, timer, GPIO, or radio peripheral needs a way to capture that instant without forcing application code to poll continuously.

### Hardware raises a source; the allocator chooses a route

A UART receive buffer absorbs an incoming burst until a configured condition asserts an interrupt source. `esp_intr_alloc()` searches for a compatible processor interrupt, reserves it, and connects the peripheral source through the interrupt matrix. The selected core can then enter the registered interrupt service routine immediately.

{% viz scene="books/esp32-reset-to-radio/chapter-3" section="chapter-3-capture" cue="0" from="0.000" to="24.161" title="A peripheral burst crosses the interrupt matrix to a chosen processor core." %}
{% endviz %}

The matrix is what keeps a large collection of peripheral sources from requiring one dedicated processor interrupt each. Allocation turns compatibility constraints and flags into a concrete route.

### The interrupt records; a task completes

The UART driver keeps its interrupt work bounded: acknowledge the condition, move urgent bytes or status, and notify deferred work. A queue can wake a blocked consumer task, allowing parsing and application logic to happen under normal scheduler rules. `esp_event_post_to()` applies the same broad pattern at the system level by copying an event into a queue that `esp_event_loop_run()` later drains and dispatches.

{% viz scene="books/esp32-reset-to-radio/chapter-3" section="chapter-3-defer" cue="4" from="24.161" to="52.012" title="A short interrupt hands heavier work to queues and scheduled tasks." %}
{% endviz %}

Responsiveness comes from separating two promises: capture the hardware moment quickly, then spend as much task time as the resulting work actually needs.

## Chapter 4 · The Packet Elevator

With code running, tasks scheduled, and hardware events under control, the ESP32 can assemble its networking path. ESP-IDF deliberately separates application sockets, the lwIP TCP/IP stack, the `esp-netif` abstraction, the Wi-Fi driver, and the radio hardware.

### Events turn association into a usable interface

Typical station setup creates the default event loop and station network interface before initializing and starting Wi-Fi. In `components/esp_wifi/src/wifi_default.c`, Wi-Fi events register receive callbacks and drive `esp-netif` actions. A station-connected event brings the interface up and begins address negotiation; the later got-address event marks a network interface that applications can actually use.

{% viz scene="books/esp32-reset-to-radio/chapter-4" section="chapter-4-connect" cue="0" from="0.000" to="29.246" title="Queued Wi-Fi events transform radio association into a configured network interface." %}
{% endviz %}

Association and an Internet Protocol address are separate milestones. The event boundary lets applications react to the precise state they require instead of guessing from radio activity.

### One packet descends, and a reply climbs

For transmission, lwIP's `low_level_output()` receives a `pbuf` and calls `esp_netif_transmit_wrap()`, which delegates to the registered driver transmit function. Reception reverses the direction: the Wi-Fi receive callback calls `esp_netif_receive()`, and `esp-netif` invokes its lwIP input function. The layers isolate ownership and lifecycle details while preserving one continuous byte path.

{% viz scene="books/esp32-reset-to-radio/chapter-4" section="chapter-4-packet" cue="4" from="29.246" to="60.465" title="A packet moves through lwIP, esp-netif, the Wi-Fi driver, and the radio." %}
{% endviz %}

The final packet is the visible payoff, but it depends on every earlier layer. Verified flash supplied the code; FreeRTOS supplied execution time; interrupts captured hardware moments; event queues coordinated state; the network stack supplied addressing and transport; and the driver finally translated bytes into radio work.
